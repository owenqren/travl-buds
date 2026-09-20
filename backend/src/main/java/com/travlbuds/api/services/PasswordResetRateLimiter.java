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
 * In-memory sliding-window rate limiter for forgot-password requests, keyed by
 * normalized email.
 *
 * State lives in this instance only, so it resets on restart and is not shared
 * between multiple app instances.
 */
@Service
public class PasswordResetRateLimiter {

    private final int maxRequests;
    private final Duration window;
    private final Map<String, Deque<Instant>> requestsByEmail = new ConcurrentHashMap<>();

    public PasswordResetRateLimiter(
            @Value("${password-reset.rate-limit.max-requests}") int maxRequests,
            @Value("${password-reset.rate-limit.window-seconds}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /** Records a request for the email and returns false if it is over the limit. */
    public boolean tryAcquire(String email) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> timestamps = requestsByEmail.computeIfAbsent(email, id -> new ArrayDeque<>());

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
