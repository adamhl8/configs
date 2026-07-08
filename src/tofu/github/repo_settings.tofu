data "local_file" "package_json" {
  filename = "${path.root}/package.json"
}

data "github_user" "current" {
  username = ""
}

locals {
  package_json = jsondecode(data.local_file.package_json.content)
  repo_url     = "github.com/${data.github_user.current.login}/${var.repo_name}"
  # a homepage pointing at the repo itself is redundant
  homepage_url = try(strcontains(local.package_json.homepage, local.repo_url) ? null : local.package_json.homepage, null)
}



resource "github_repository" "current" {
  name         = var.repo_name
  description  = local.package_json.description
  visibility   = var.repo_settings.visibility
  homepage_url = local.homepage_url
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
