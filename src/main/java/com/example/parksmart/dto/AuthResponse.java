package com.example.parksmart.dto;

public class AuthResponse {

    private String token;
    private String username;
    private String email;
    private String role;

    public AuthResponse(
            String token,
            String username,
            String email,
            String role) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
