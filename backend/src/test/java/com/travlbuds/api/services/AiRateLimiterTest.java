// Tests for AiRateLimiter.
package com.travlbuds.api.services;

import org.junit.jupiter.api.Test;

// JUnit assertions.
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRateLimiterTest {

    // With a limit of 2 per 600s, the third call is blocked.
    @Test
    void blocksRequestsOverTheLimit() {
        AiRateLimiter limiter = new AiRateLimiter(2, 600);

        assertTrue(limiter.tryAcquire(1L));
        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
    }

    // Each user id has its own window: user 2 is unaffected by user 1 hitting the limit.
    @Test
    void tracksUsersIndependently() {
        AiRateLimiter limiter = new AiRateLimiter(1, 600);

        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
        assertTrue(limiter.tryAcquire(2L));
    }

    // After the 1s window elapses (real sleep of 1.1s), the user can make a request again.
    @Test
    void allowsRequestsAgainOnceTheWindowHasPassed() throws InterruptedException {
        AiRateLimiter limiter = new AiRateLimiter(1, 1);

        assertTrue(limiter.tryAcquire(1L));
        assertFalse(limiter.tryAcquire(1L));
        Thread.sleep(1100);
        assertTrue(limiter.tryAcquire(1L));
    }
}
