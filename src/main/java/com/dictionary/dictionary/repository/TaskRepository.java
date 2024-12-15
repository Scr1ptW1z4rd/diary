package com.dictionary.dictionary.repository;

import com.dictionary.dictionary.entity.Task;
import com.dictionary.dictionary.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date ASC, t.startTime ASC")
    List<Task> findByUserAndDateBetweenOrderByDateAscStartTimeAsc(@Param("user") User user, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
