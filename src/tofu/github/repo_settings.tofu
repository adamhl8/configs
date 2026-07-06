data "local_file" "package_json" {
  filename = "${path.root}/package.json"
}

locals {
  package_json = jsondecode(data.local_file.package_json.content)
}

resource "github_repository" "current" {
  name         = var.repo_name
  description  = local.package_json.description
  visibility   = var.repo_settings.visibility
  homepage_url = var.repo_settings.homepage_url
  topics       = try(local.package_json.keywords, [])

  allow_merge_commit          = false
  allow_auto_merge            = false
  allow_forking               = true
  allow_rebase_merge          = false
  allow_squash_merge          = true
  allow_update_branch         = false
  delete_branch_on_merge      = true
  has_discussions             = true
  has_issues                  = true
  has_projects                = false
  has_wiki                    = false
  squash_merge_commit_title   = "PR_TITLE"
  squash_merge_commit_message = "BLANK"
  web_commit_signoff_required = false

  security_and_analysis {
    secret_scanning {
      status = "enabled"
    }
    secret_scanning_push_protection {
      status = "enabled"
    }
  }
}

resource "github_actions_repository_permissions" "current" {
  repository      = github_repository.current.name
  allowed_actions = "all"
}

resource "github_repository_vulnerability_alerts" "current" {
  repository = github_repository.current.name
  enabled    = true
}

resource "github_repository_dependabot_security_updates" "current" {
  repository = github_repository.current.name
  enabled    = false
}
