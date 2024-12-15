package com.dictionary.dictionary.service;

import com.dictionary.dictionary.entity.User;
import com.dictionary.dictionary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getOrCreateUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        User user = userRepository.findByEmail(email);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .name(oauth2User.getAttribute("name"))
                    .build();
            userRepository.save(user);
        }
        return user;
    }
}
