package com.first.neuroprocessing.repository;

import com.first.neuroprocessing.entity.PasswordResetToken;
import com.first.neuroprocessing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUser(User user);
}
