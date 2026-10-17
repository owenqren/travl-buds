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
        String authHeader = request.getHeader("Authorization");

        // No/malformed header: proceed unauthenticated and let SecurityConfig reject non-/api/auth/** routes.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Strip "Bearer " and ask JwtService for the verified email (throws if signature/expiry is bad).
            String token = authHeader.substring(7);
            String email = jwtService.getEmailFromToken(token);

            // Load the account through UserRepository; null if the user no longer exists.
            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // The User entity itself is the principal, so controllers cast Authentication.getPrincipal()
                // to User instead of taking an id from the request.
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                        List.of());
                authentication.setDetails(user.getEmail());

                // Publishes the authentication to the SecurityContext for the rest of this request.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ignored) {
            // Invalid/expired token: clear rather than throw, so the request still falls through
            // to SecurityConfig's normal unauthenticated handling below.
            SecurityContextHolder.clearContext();
        }

        // Always continue down the filter chain.
        filterChain.doFilter(request, response);
    }
}
