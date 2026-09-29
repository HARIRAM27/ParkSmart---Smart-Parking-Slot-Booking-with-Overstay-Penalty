package com.example.parksmart.dto;

import java.time.LocalDateTime;

import com.example.parksmart.Enums.Role;
import com.example.parksmart.model.User;

/**
 * Safe user representation - never includes the password field.
 */
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.id = user.getId();
        r.username = user.getUsername();
        r.email = user.getEmail();
        r.role = user.getRole();
        r.enabled = user.isEnabled();
        r.createdAt = user.getCreatedAt();
        return r;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
