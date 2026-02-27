package com.pisito.app.repository;

import com.pisito.app.model.SavedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<SavedResource, Long> {
    List<SavedResource> findAllByOrderByCreatedAtDesc();
}

