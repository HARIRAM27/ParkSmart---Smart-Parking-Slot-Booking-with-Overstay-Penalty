package com.example.parksmart.service;

import com.example.parksmart.dto.AdminCreateUserRequest;
import com.example.parksmart.dto.AuthResponse;
import com.example.parksmart.dto.LoginRequest;
import com.example.parksmart.dto.RegisterRequest;
import com.example.parksmart.dto.UserResponse;

import java.util.List;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse createUser(AdminCreateUserRequest request);

    UserResponse updateUser(Long id, com.example.parksmart.dto.AdminUpdateUserRequest request);

    UserResponse updateUserRole(Long id, String role);

    UserResponse toggleUserEnabled(Long id);

    void deleteUser(Long id);
}
