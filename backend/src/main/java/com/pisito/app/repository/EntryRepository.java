package com.pisito.app.repository;

import com.pisito.app.model.Entry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntryRepository extends JpaRepository<Entry, Long> {
    List<Entry> findAllByOrderByCreateDateDesc();
}

