package com.portfolio.optimizer.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/visualizations")
@CrossOrigin(origins = "*")
public class VisualizationController {
    
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getVisualization(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("src/main/python/output/" + filename);
            Resource resource = new FileSystemResource(filePath);
            
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "inline; filename=\"" + filename + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
