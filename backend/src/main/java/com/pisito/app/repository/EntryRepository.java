package com.pisito.app.repository;

import com.pisito.app.model.Entry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EntryRepository extends JpaRepository<Entry, Long> {

    List<Entry> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Entry> findByIdAndOwnerId(Long id, Long ownerId);
}
