package com.fairshare.api.models;

    import jakarta.persistence.*;

    @Entity
    @Table(name = "users") // "user" is a reserved word in Postgres, so we use "users"
    public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        private String username;
        private String email;

        // Empty constructor required by JPA
        public User() {}

        public User(String username, String email) {
            this.username = username;
            this.email = email;
        }
    }