package com.pisito.app.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "entries")
public class Entry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "create_date", nullable = false, updatable = false)
    private Instant createDate;

    @Column(name = "update_date", nullable = false)
    private Instant updateDate;

    @Column(name = "notification_date")
    private Instant notificationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "flag", length = 30)
    private FlagEnum flag;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<Resource> resources = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        if (createDate == null) {
            createDate = now;
        }
        if (updateDate == null) {
            updateDate = now;
        }
        if (flag == null) {
            flag = FlagEnum.TEXT;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updateDate = Instant.now();
    }

    public void addResource(Resource resource) {
        resources.add(resource);
        resource.setEntry(this);
        touch();
    }

    public void removeResource(Resource resource) {
        resources.remove(resource);
        resource.setEntry(null);
        touch();
    }

    public void touch() {
        updateDate = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Instant getCreateDate() {
        return createDate;
    }

    public void setCreateDate(Instant createDate) {
        this.createDate = createDate;
    }

    public Instant getUpdateDate() {
        return updateDate;
    }

    public void setUpdatedDate(Instant updateDate) {
        this.updateDate = updateDate;
    }

    public Instant getNotificationDate() {
        return notificationDate;
    }

    public void setNotificationDate(Instant notificationDate) {
        this.notificationDate = notificationDate;
    }

    public FlagEnum getFlag() {
        return flag;
    }

    public void setFlag(FlagEnum flag) {
        this.flag = flag;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public List<Resource> getResources() {
        return resources;
    }

    public void setResources(List<Resource> resources) {
        this.resources = resources;
    }
}
