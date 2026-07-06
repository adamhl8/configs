terraform {
  backend "s3" {
    profile = "adamhl8"
    bucket  = "tofu-state-269329412317-us-east-1-an"
    key     = "adamhl8/configs.tfstate"
    region  = "us-east-1"
  }
}

module "github" {
  source    = "./src/tofu/github"
  repo_name = "configs"
  actions_secrets = {
    NPM_CI_TOKEN = true
  }
  repo_settings = {
    visibility = "public"
  }
}
