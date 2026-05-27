package com.travlbuds.api.repositories;

    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.stereotype.Repository;

import com.travlbuds.api.models.User;

    @Repository
    public interface UserRepository extends JpaRepository<User, Long> {

    }