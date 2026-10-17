// Services package: business logic shared by controllers.
package com.travlbuds.api.services;

// @Value reads password-reset.rate-limit.* properties; @Service registers the bean.
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Time and concurrent collection types for the sliding window.
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter for forgot-password requests, keyed by
 * normalized email.
 *
 * State lives in this instance only, so it resets on restart and is not shared
 * between multiple app instances.
 */
@Service
public class PasswordResetRateLimiter {

    // Limit settings and per-email request timestamps (the only mutable state).
    private final int maxRequests;
    private final Duration window;
    private final Map<String, Deque<Instant>> requestsByEmail = new ConcurrentHashMap<>();

    // Reads max-requests and window-seconds from application properties.
    public PasswordResetRateLimiter(
            @Value("${password-reset.rate-limit.max-requests}") int maxRequests,
            @Value("${password-reset.rate-limit.window-seconds}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /** Records a request for the email and returns false if it is over the limit. */
    public boolean tryAcquire(String email) {
        // Window start: anything older than this no longer counts.
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> timestamps = requestsByEmail.computeIfAbsent(email, id -> new ArrayDeque<>());

        // Lock this email's deque so concurrent requests can't race.
        synchronized (timestamps) {
            // Drop expired timestamps, then reject if the window is already full.
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            // Under the limit: record this request.
            timestamps.addLast(now);
            return true;
        }
    }
}
