package com.example.parksmart.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parksmart.model.User;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
