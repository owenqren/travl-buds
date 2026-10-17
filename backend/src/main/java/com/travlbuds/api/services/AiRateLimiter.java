// Services package: business logic shared by controllers.
package com.travlbuds.api.services;

// @Value reads ai.rate-limit.* properties; @Service registers the bean.
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
 * In-memory sliding-window rate limiter for AI requests, keyed by user id.
 *
 * State lives in this instance only, so it resets on restart and is not shared
 * between multiple app instances.
 */
@Service
public class AiRateLimiter {

    // Limit settings and per-user request timestamps (the only mutable state).
    private final int maxRequests;
    private final Duration window;
    private final Map<Long, Deque<Instant>> requestsByUser = new ConcurrentHashMap<>();

    // Reads max-requests and window-seconds from application properties.
    public AiRateLimiter(
            @Value("${ai.rate-limit.max-requests}") int maxRequests,
            @Value("${ai.rate-limit.window-seconds}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /** Records a request for the user and returns false if they are over the limit. */
    public boolean tryAcquire(Long userId) {
        // Window start: anything older than this no longer counts.
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> timestamps = requestsByUser.computeIfAbsent(userId, id -> new ArrayDeque<>());

        // Lock this user's deque so concurrent requests can't race.
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
