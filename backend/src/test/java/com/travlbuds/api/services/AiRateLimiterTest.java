package com.travlbuds.api.services;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRateLimiterTest {

    @Test
    void blocksRequestsOverTheLimit() {
        AiRateLimiter limiter = new AiRateLimiter(2, 600);

        assertTrue(limiter.tryAcquire(1L));
        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
    }

    @Test
    void tracksUsersIndependently() {
        AiRateLimiter limiter = new AiRateLimiter(1, 600);

        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
        assertTrue(limiter.tryAcquire(2L));
    }

    @Test
    void allowsRequestsAgainOnceTheWindowHasPassed() throws InterruptedException {
        AiRateLimiter limiter = new AiRateLimiter(1, 1);

        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
        Thread.sleep(1100);
        assertTrue(limiter.tryAcquire(1L));
    }
}
