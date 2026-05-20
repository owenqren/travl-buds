package com.fairshare.api.controller;

    import com.fairshare.api.models.Trip; 
    import com.fairshare.api.repositories.TripRepository;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/trips")
    @CrossOrigin("*")
    public class TripController {

        @Autowired
        private TripRepository tripRepository;

        @GetMapping
        public List<Trip> getAllTrips() {
            return tripRepository.findAll();
        }

        @PostMapping
        public Trip createTrip(@RequestBody Trip trip) {
            return tripRepository.save(trip);
        }
    }