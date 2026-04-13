package com.taskflow.service;

import com.taskflow.dto.auth.AuthResponse;
import com.taskflow.dto.auth.UserResponse;
import com.taskflow.entity.User;
import com.taskflow.exception.GlobalExceptionHandler.ConflictException;
import com.taskflow.exception.GlobalExceptionHandler.UnauthorizedException;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(String name, String email, String password) {
        if (userRepository.existsByEmail(email.toLowerCase().trim())) {
            throw new ConflictException();
        }

        User user = User.builder()
                .name(name)
                .email(email.toLowerCase().trim())
                .password(passwordEncoder.encode(password))
                .build();

        user = userRepository.save(user);
        // Refresh to get server-generated fields
        user = userRepository.findById(user.getId()).orElseThrow();

        String token = jwtUtil.createToken(user.getId(), user.getEmail(), user.getName());
        return new AuthResponse(token, UserResponse.from(user));
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(UnauthorizedException::new);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException();
        }

        String token = jwtUtil.createToken(user.getId(), user.getEmail(), user.getName());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
