package com.expensetracker.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal in-memory bearer-token store.
 *
 * The app issues a random opaque token on login/register (see AuthService) and the
 * frontend sends it back as "Authorization: Bearer <token>" on every request
 * (see static/js/api.js). Previously that token was never recorded anywhere, so
 * TokenAuthenticationFilter had nothing to look it up against and every
 * @AuthenticationPrincipal in the app resolved to null. This class is the missing
 * link: it maps issued tokens back to the user's email so the filter can restore
 * identity on each request.
 *
 * Tokens live only in memory, so they are invalidated on app restart. That's fine
 * for this app's scale; swap for a JWT or a persisted store if you need tokens to
 * survive restarts or to run behind multiple app instances.
 */
@Component
public class TokenStore {

    private final Map<String, String> tokenToEmail = new ConcurrentHashMap<>();

    public String issueToken(String email) {
        String token = UUID.randomUUID().toString();
        tokenToEmail.put(token, email);
        return token;
    }

    public String resolveEmail(String token) {
        if (token == null) return null;
        return tokenToEmail.get(token);
    }

    public void invalidate(String token) {
        if (token != null) tokenToEmail.remove(token);
    }
}
