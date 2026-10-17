// Security package: JWT filter, token service and Spring Security config.
package com.travlbuds.api.security;

// User entity (becomes the principal) and UserRepository (loads it by the token's email).
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;

// Servlet and Spring Security types needed to build a once-per-request filter and populate the SecurityContext.
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Registered as a Spring bean; SecurityConfig inserts it before UsernamePasswordAuthenticationFilter.
@Component
// How: OncePerRequestFilter guarantees doFilterInternal runs exactly once per request. Spring Security's filter chain
// calls it before the authorization rules in SecurityConfig are evaluated, so by the time a controller runs the
// SecurityContext either holds a User or is empty.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Collaborators: JwtService validates the token, UserRepository finds the account.
    private final JwtService jwtService;
    private final UserRepository userRepository;

    // Constructor injection of the two collaborators.
    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    // Runs once per request: reads the Authorization header and, if the JWT is valid, authenticates the request.
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        // How: the header looks like 'Authorization: Bearer <jwt>'; it is null for requests without credentials.
        String authHeader = request.getHeader("Authorization");

        // No/malformed header: proceed unauthenticated and let SecurityConfig reject non-/api/auth/** routes.
        // How: returning early without touching the SecurityContext leaves the request anonymous, so SecurityConfig
        // answers 401/403 for protected routes.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Strip "Bearer " and ask JwtService for the verified email (throws if signature/expiry is bad).
            // How: 'Bearer ' is 7 characters, so substring(7) leaves just the JWT. getEmailFromToken verifies the HMAC
            // signature and expiry and returns the 'sub' claim.
            String token = authHeader.substring(7);
            String email = jwtService.getEmailFromToken(token);

            // Load the account through UserRepository; null if the user no longer exists.
            // How: one indexed lookup by email per authenticated request; orElse(null) avoids an exception if the
            // account was deleted after the token was issued.
            User user = userRepository.findByEmail(email).orElse(null);

            // How: the getAuthentication() == null check avoids overwriting an authentication that an earlier filter
            // already set.
            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // The User entity itself is the principal, so controllers cast Authentication.getPrincipal()
                // to User instead of taking an id from the request.
                // How: the three-argument UsernamePasswordAuthenticationToken constructor marks the token as
                // authenticated. The principal is the User entity, credentials are null (the JWT already proved
                // identity), and the authority list is empty because the app has no roles.
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                        List.of());
                authentication.setDetails(user.getEmail());

                // Publishes the authentication to the SecurityContext for the rest of this request.
                // How: SecurityContextHolder stores the context in a thread-local for the duration of this request;
                // controllers read it through the Authentication parameter or SecurityContextHolder.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ignored) {
            // Invalid/expired token: clear rather than throw, so the request still falls through
            // to SecurityConfig's normal unauthenticated handling below.
            // How: any exception from the token check (bad format, bad signature, expired) lands here; clearing the
            // context ensures nothing half-set survives.
            SecurityContextHolder.clearContext();
        }

        // Always continue down the filter chain.
        // How: always passes control to the next filter; the decision to reject happens later, in the authorization
        // step.
        filterChain.doFilter(request, response);
    }
}
