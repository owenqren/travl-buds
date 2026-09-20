package com.travlbuds.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Boots the full application context against the in-memory H2 database
// configured in src/test/resources/application-test.properties, so this
// runs the same on any machine or CI without needing real Supabase credentials.
@SpringBootTest
@ActiveProfiles("test")
class ApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
