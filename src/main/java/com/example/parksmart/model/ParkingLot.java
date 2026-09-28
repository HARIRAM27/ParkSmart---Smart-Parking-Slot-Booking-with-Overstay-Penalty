package com.example.parksmart.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;


@Entity
@Table(name = "parking_lots")
public class ParkingLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Lot name is required")
    @Size(max = 100, message = "Lot name cannot exceed 100 characters")
    private String lotName;

    @NotBlank(message = "Location is required")
    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    @NotNull(message = "Total slots is required")
    @Positive(message = "Total slots must be greater than 0")
    private Integer totalSlots;

    @NotNull(message = "Penalty rate is required")
    @PositiveOrZero(message = "Penalty rate cannot be negative")
    private Double penaltyRate;

    @NotNull(message = "Penalty unit minutes is required")
    @Positive(message = "Penalty unit minutes must be greater than 0")
    private Integer penaltyUnitMinutes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLotName() {
        return lotName;
    }

    public void setLotName(String lotName) {
        this.lotName = lotName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getTotalSlots() {
        return totalSlots;
    }

    public void setTotalSlots(Integer totalSlots) {
        this.totalSlots = totalSlots;
    }

    public Double getPenaltyRate() {
        return penaltyRate;
    }

    public void setPenaltyRate(Double penaltyRate) {
        this.penaltyRate = penaltyRate;
    }

    public Integer getPenaltyUnitMinutes() {
        return penaltyUnitMinutes;
    }

    public void setPenaltyUnitMinutes(Integer penaltyUnitMinutes) {
        this.penaltyUnitMinutes = penaltyUnitMinutes;
    }
}