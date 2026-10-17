// Test root package; same package as ApiApplication so @SpringBootTest finds the @SpringBootApplication class.
package com.travlbuds.api;

// JUnit 5 @Test, Spring Boot's @SpringBootTest and the profile selector.
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Boots the full application context against the in-memory H2 database
// configured in src/test/resources/application-test.properties, so this
// runs the same on any machine or CI without needing real Supabase credentials.
// @ActiveProfiles("test") loads application-test.properties on top of the defaults.
@SpringBootTest
@ActiveProfiles("test")
class ApiApplicationTests {

	// Passes if the Spring context starts; depends on all beans (controllers, services, repositories, SecurityConfig) wiring correctly.
	@Test
	void contextLoads() {
	}

}
