resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "docker-images"
  description   = "Docker images"
  format        = "DOCKER"
}