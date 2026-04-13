package com.taskflow.controller;

import com.taskflow.dto.auth.UserResponse;
import com.taskflow.entity.User;
import com.taskflow.exception.GlobalExceptionHandler.NotFoundException;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public UserResponse searchByEmail(@RequestParam String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(NotFoundException::new);
        return UserResponse.from(user);
    }
}
