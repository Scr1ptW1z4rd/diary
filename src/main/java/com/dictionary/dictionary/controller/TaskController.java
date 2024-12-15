package com.dictionary.dictionary.controller;

import com.dictionary.dictionary.entity.Task;
import com.dictionary.dictionary.entity.User;
import com.dictionary.dictionary.service.TaskService;
import com.dictionary.dictionary.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Slf4j
public class TaskController {
    @Autowired
    private TaskService taskService;
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User user = userService.getOrCreateUser(principal);
        List<Task> tasks = taskService.getTasksBetweenDatesForUser(user, startDate, endDate);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<?> addTask(@AuthenticationPrincipal OAuth2User principal, @RequestBody Task task) {
        log.info("Attempting to add task. User: {}, Task: {}", principal, task);
        if (principal == null) {
            log.warn("User not authenticated");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User not authenticated");
        }
        try {
            log.info("Received task: {}", task);
            if (task.getTitle() == null || task.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body("Title is required");
            }
            User user = userService.getOrCreateUser(principal);
            task.setUser(user);
            Task savedTask = taskService.addTask(task);
            // Создайте новый объект Task без ссылки на пользователя
            Task responseTask = new Task();
            BeanUtils.copyProperties(savedTask, responseTask);
            responseTask.setUser(null);
            return ResponseEntity.ok(responseTask);
        } catch (Exception e) {
            log.error("Error adding task", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id, @RequestBody Task updatedTask) {
        User user = userService.getOrCreateUser(principal);
        Task existingTask = taskService.getTaskById(id);
        if (existingTask == null || !existingTask.getUser().getId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }

        if (updatedTask.getDate() != null) {
            existingTask.setDate(updatedTask.getDate());
        }
        if (updatedTask.getTitle() != null) {
            existingTask.setTitle(updatedTask.getTitle());
        }
        if (updatedTask.getText() != null) {
            existingTask.setText(updatedTask.getText());
        }
        if (updatedTask.getColor() != null) {
            existingTask.setColor(updatedTask.getColor());
        }
        if (updatedTask.getStartTime() != null) {
            existingTask.setStartTime(updatedTask.getStartTime());
        }
        if (updatedTask.getEndTime() != null) {
            existingTask.setEndTime(updatedTask.getEndTime());
        }
        existingTask.setCompleted(updatedTask.isCompleted());

        Task savedTask = taskService.updateTask(existingTask);
        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        User user = userService.getOrCreateUser(principal);
        Task task = taskService.getTaskById(id);
        if (task != null && task.getUser().getId().equals(user.getId())) {
            return ResponseEntity.ok(task);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        User user = userService.getOrCreateUser(principal);
        Task task = taskService.getTaskById(id);
        if (task != null && task.getUser().getId().equals(user.getId())) {
            taskService.deleteTask(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}