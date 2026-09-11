terraform {
  backend "gcs" {
    bucket = "devops-assessment-bp-tfstate-roberto"
    prefix = "terraform/state"
  }
}