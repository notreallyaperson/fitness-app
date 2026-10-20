# This retired root no longer owns fitness. Do not override the guard. Use premierfleets-devops/deployment/project.
variable "fitness_legacy_root_retired" {
  type    = bool
  default = true
  validation {
    condition     = !var.fitness_legacy_root_retired
    error_message = "RETIRED: fitness ownership moved to premierfleets-devops/deployment/project. Do not apply this app-local root."
  }
}
