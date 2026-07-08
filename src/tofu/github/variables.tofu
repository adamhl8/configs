variable "repo_name" {
  description = "The GitHub repository name"
  type        = string
}

variable "repo_settings" {
  description = "The GitHub repository settings"
  type = object({
    visibility = string
  })
}

variable "actions_secrets" {
  description = "defaults: CI_SIGNING_KEY, CI_TOKEN"
  type = object({
    CI_SIGNING_KEY = optional(bool, true)
    CI_TOKEN       = optional(bool, true)
    NPM_CI_TOKEN   = optional(bool, false)
    GH_TOKEN       = optional(bool, false)
  })
  default = {}
}

variable "additional_secrets" {
  description = "Additional secret names to manage"
  type        = set(string)
  default     = []
}
