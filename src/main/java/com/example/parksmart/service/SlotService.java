package com.example.parksmart.service;

import java.util.List;

import com.example.parksmart.model.Slot;

public interface SlotService {

    Slot create(Slot slot);

    List<Slot> getAll();

    Slot getById(Long id);

    Slot update(Long id, Slot slot);

    void delete(Long id);

    List<Slot> getActiveSlotsByLot(Long lotId);
}