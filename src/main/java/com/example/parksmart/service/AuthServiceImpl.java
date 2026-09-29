package com.example.parksmart.service;

import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.parksmart.Enums.Role;
import com.example.parksmart.dto.AdminCreateUserRequest;
import com.example.parksmart.dto.AdminUpdateUserRequest;
import com.example.parksmart.dto.AuthResponse;
import com.example.parksmart.dto.LoginRequest;
import com.example.parksmart.dto.RegisterRequest;
import com.example.parksmart.dto.UserResponse;
import com.example.parksmart.exception.InvalidBookingException;
import com.example.parksmart.exception.ResourceNotFoundException;
import com.example.parksmart.model.User;
import com.example.parksmart.repo.UserRepo;
import com.example.parksmart.security.JwtUtil;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {

        if (userRepo.existsByUsername(request.getUsername())) {
            throw new InvalidBookingException(
                    "Username '" + request.getUsername() + "' is already taken"
            );
        }

        if (userRepo.existsByEmail(request.getEmail())) {
            throw new InvalidBookingException(
                    "Email '" + request.getEmail() + "' is already registered"
            );
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.CUSTOMER   // Public registration always creates CUSTOMER
        );

        userRepo.save(user);

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .roles(user.getRole().name())
                        .build();

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) auth.getPrincipal();

            String token = jwtUtil.generateToken(userDetails);

            User user = userRepo.findByUsername(request.getUsername())
                    .orElseThrow();

            return new AuthResponse(
                    token,
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name()
            );

        } catch (DisabledException e) {
            throw new DisabledException(
                    "Account is disabled. Please contact an administrator."
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException(
                    "Invalid username or password."
            );
        }
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepo.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id
                ));
        return UserResponse.from(user);
    }

    @Override
    public UserResponse createUser(AdminCreateUserRequest request) {

        if (userRepo.existsByUsername(request.getUsername())) {
            throw new InvalidBookingException(
                    "Username '" + request.getUsername() + "' is already taken"
            );
        }

        if (userRepo.existsByEmail(request.getEmail())) {
            throw new InvalidBookingException(
                    "Email '" + request.getEmail() + "' is already registered"
            );
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        return UserResponse.from(userRepo.save(user));
    }

    @Override
    public UserResponse updateUser(Long id, AdminUpdateUserRequest request) {

        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id
                ));

        if (!user.getUsername().equals(request.getUsername()) && userRepo.existsByUsername(request.getUsername())) {
            throw new InvalidBookingException("Username '" + request.getUsername() + "' is already taken");
        }

        if (!user.getEmail().equals(request.getEmail()) && userRepo.existsByEmail(request.getEmail())) {
            throw new InvalidBookingException("Email '" + request.getEmail() + "' is already registered");
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        return UserResponse.from(userRepo.save(user));
    }

    @Override
    public UserResponse updateUserRole(Long id, String roleName) {

        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id
                ));

        try {
            Role role = Role.valueOf(roleName.toUpperCase());
            user.setRole(role);
        } catch (IllegalArgumentException e) {
            throw new InvalidBookingException("Invalid role: " + roleName);
        }

        return UserResponse.from(userRepo.save(user));
    }

    @Override
    public UserResponse toggleUserEnabled(Long id) {

        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id
                ));

        user.setEnabled(!user.isEnabled());

        return UserResponse.from(userRepo.save(user));
    }

    @Override
    public void deleteUser(Long id) {

        if (!userRepo.existsById(id)) {
            throw new ResourceNotFoundException(
                    "User not found with id: " + id
            );
        }

        userRepo.deleteById(id);
    }
}
