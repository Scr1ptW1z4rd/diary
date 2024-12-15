package com.dictionary.dictionary.service;

import com.dictionary.dictionary.entity.Task;
import com.dictionary.dictionary.entity.User;
import com.dictionary.dictionary.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;

    public List<Task> getTasksBetweenDates(LocalDate startDate, LocalDate endDate) {
        return taskRepository.findByDateBetween(startDate, endDate);
    }

    public Task addTask(Task task) {
        if (task.getDate() == null) {
            task.setDate(LocalDate.now());
        }
        return taskRepository.save(task);
    }
    public Task getTaskById(Long id) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (taskOptional.isPresent()) {
            Task task = taskOptional.get();
            log.info("Task found: id={}, title={}, date={}", task.getId(), task.getTitle(), task.getDate());
            return task;
        } else {
            log.warn("Task with id {} not found", id);
            return null;
        }
    }

    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public List<Task> getTasksBetweenDatesForUser(User user, LocalDate startDate, LocalDate endDate) {
        return taskRepository.findByUserAndDateBetweenOrderByDateAscStartTimeAsc(user, startDate, endDate);
    }
}