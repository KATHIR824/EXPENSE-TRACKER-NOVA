package com.expensetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads "Authorization: Bearer <token>", resolves it via TokenStore, loads the
 * matching user, and populates the SecurityContext so that
 * @AuthenticationPrincipal User works in controllers.
 *
 * Without this filter, SecurityConfig's permitAll() meant requests reached
 * controllers with no Authentication at all, so every @AuthenticationPrincipal
 * User user parameter was null - breaking every expense/income/budget/savings
 * endpoint (NullPointerException or failed-not-null-column errors on save).
 */
@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final TokenStore tokenStore;
    private final CustomUserDetailsService userDetailsService;

    public TokenAuthenticationFilter(TokenStore tokenStore, CustomUserDetailsService userDetailsService) {
        this.tokenStore = tokenStore;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(HEADER);

        if (header != null && header.startsWith(PREFIX) && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(PREFIX.length());
            String email = tokenStore.resolveEmail(token);

            if (email != null) {
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (UsernameNotFoundException ignored) {
                    // Token pointed at a user that no longer exists/is inactive - leave unauthenticated.
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
