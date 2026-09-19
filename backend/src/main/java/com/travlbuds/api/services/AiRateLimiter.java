package com.travlbuds.api.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    private final int maxRequests;
    private final Duration window;
    private final Map<Long, Deque<Instant>> requestsByUser = new ConcurrentHashMap<>();

    public AiRateLimiter(
            @Value("${ai.rate-limit.max-requests}") int maxRequests,
            @Value("${ai.rate-limit.window-seconds}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /** Records a request for the user and returns false if they are over the limit. */
    public boolean tryAcquire(Long userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> timestamps = requestsByUser.computeIfAbsent(userId, id -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }
}
