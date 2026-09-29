package com.example.parksmart.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;

    public SecurityConfig(
            UserDetailsServiceImpl userDetailsService,
            JwtAuthenticationFilter jwtFilter,
            JwtAuthEntryPoint jwtAuthEntryPoint) {
        this.userDetailsService = userDetailsService;
        this.jwtFilter = jwtFilter;
        this.jwtAuthEntryPoint = jwtAuthEntryPoint;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        // Spring Security 7: DaoAuthenticationProvider constructor requires UserDetailsService
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtAuthEntryPoint)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                        "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied. You do not have permission to perform this action.\",\"path\":\""
                        + request.getRequestURI() + "\"}"
                    );
                })
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers("/api/auth/register", "/api/auth/login", "/error").permitAll()
                // Static frontend files
                .requestMatchers(
                    "/", "/index.html", "/login.html", "/register.html",
                    "/dashboard.html", "/admin.html", "/manager.html", "/customer.html",
                    "/css/**", "/js/**", "/images/**"
                ).permitAll()
                // Admin only user management
                .requestMatchers("/api/admin/**", "/api/auth/admin/**", "/api/auth/users/**").hasRole("ADMIN")
                // Parking Manager only for parking lot write operations (Admin is READ-ONLY, Customer is READ-ONLY)
                .requestMatchers(HttpMethod.POST, "/api/lots/**").hasRole("PARKING_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/lots/**").hasRole("PARKING_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/lots/**").hasRole("PARKING_MANAGER")
                // Parking Manager only for slot write operations (Admin is READ-ONLY, Customer is READ-ONLY)
                .requestMatchers(HttpMethod.POST, "/api/slots/**").hasRole("PARKING_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/slots/**").hasRole("PARKING_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/slots/**").hasRole("PARKING_MANAGER")
                // Check-in/out write operations for Parking Manager only (Admin is READ-ONLY, Customer is READ-ONLY)
                .requestMatchers("/api/checkinout/checkin/**").hasRole("PARKING_MANAGER")
                .requestMatchers("/api/checkinout/checkout/**").hasRole("PARKING_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/checkinout").hasAnyRole("ADMIN", "PARKING_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/checkinout/occupancy/**").hasAnyRole("ADMIN", "PARKING_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/checkinout/**").authenticated()
                // Read lots/slots for all authenticated
                .requestMatchers(HttpMethod.GET, "/api/lots/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/slots/**").authenticated()
                // Customer only creates bookings
                .requestMatchers(HttpMethod.POST, "/api/bookings/**").hasRole("CUSTOMER")
                // Booking endpoints - authorization at method level
                .requestMatchers("/api/bookings/**").authenticated()
                // All else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
