// Security package: JWT filter, token service and Spring Security config.
package com.travlbuds.api.security;

// Spring configuration and Spring Security types used to define beans and the filter chain.
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// CORS types for allowing the frontend origins.
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

// Declares security beans: CORS, the filter chain and the password encoder.
@Configuration
public class SecurityConfig {

    // The JWT filter that authenticates requests; injected below.
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Constructor injection of JwtAuthenticationFilter.
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // CORS policy: hardcoded allowed origins (production site and Vite dev server); applies to all paths.
    @Bean
    // How: browsers block cross-origin calls unless the server answers with CORS headers. Spring matches the request's
    // Origin header against this allow-list; allowCredentials(true) is why origins must be listed explicitly instead of
    // '*'.
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://travlbuds.com", "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Main chain: stateless, no CSRF, only /api/auth/** is public, other /api/** needs a valid JWT; depends on corsConfigurationSource and the JWT filter.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // How: HttpSecurity is a builder. csrf is disabled because requests authenticate with a Bearer header, not
        // cookies; STATELESS stops Spring creating HTTP sessions; authorization rules are checked top to bottom (first
        // match wins), so /api/auth/** is public and the rest of /api/** requires an authenticated User set by the JWT
        // filter.
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/ai/**").authenticated()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                // How: puts the JWT filter ahead of Spring's username/password filter so the SecurityContext is
                // populated before authorization rules run.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // BCrypt encoder used by AuthController to hash and verify passwords.
    @Bean
    // How: BCrypt hashes passwords with a per-password random salt and a work factor, so identical passwords produce
    // different hashes and brute force is slow; Spring injects this bean wherever a PasswordEncoder is requested.
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
