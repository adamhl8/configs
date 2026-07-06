data "sops_file" "secrets" {
  source_file = pathexpand("~/secrets.yaml")
}

data "github_actions_secrets" "current" {
  name = var.repo_name
}

locals {
  desired_secrets = setunion(
    toset([for k, v in var.actions_secrets : k if v]),
    var.additional_secrets
  )
}

locals {
  unmanaged_secrets = setsubtract(
    data.github_actions_secrets.current.secrets[*].name,
    local.desired_secrets
  )
}

check "no_unmanaged_secrets" {
  assert {
    condition     = length(local.unmanaged_secrets) == 0
    error_message = "Unmanaged secrets on '${var.repo_name}': ${join(", ", local.unmanaged_secrets)}"
  }
}

resource "github_actions_secret" "secrets" {
  for_each    = local.desired_secrets
  repository  = var.repo_name
  secret_name = each.value
  value       = data.sops_file.secrets.data[lower(each.value)]
}
