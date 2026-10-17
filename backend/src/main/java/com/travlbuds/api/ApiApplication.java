// Package for the whole backend; every other class lives under com.travlbuds.api.
package com.travlbuds.api;

// Imports Spring Boot's launcher (SpringApplication) and the @SpringBootApplication annotation; both come from the spring-boot dependency.
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot entry point for the Fairshare API.
 *
 * Starts the backend application and loads the Spring application context.
 */

// Marks this class as the Spring Boot config root: enables component scanning of com.travlbuds.api.* (controllers, services, repositories) and auto-configuration.
// How: this single annotation combines @Configuration, @EnableAutoConfiguration and @ComponentScan. Component scanning
// starts at this class's package, so every @RestController, @Service, @Component and @Configuration under
// com.travlbuds.api is registered as a bean, and auto-configuration wires JPA, Security and the web server from the
// dependencies on the classpath.
@SpringBootApplication
public class ApiApplication {

	// JVM entry point; depends on SpringApplication.run to boot the context using ApiApplication as the config root.
	public static void main(String[] args) {
		// How: run() creates the Spring application context, instantiates the beans (injecting constructor arguments),
		// connects to the database, and starts the embedded web server on port 8080.
		SpringApplication.run(ApiApplication.class, args);
	}

}
