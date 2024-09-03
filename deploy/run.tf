resource "google_cloud_run_v2_service" "croaker_service" {
  name     = "croaker"
  location = "asia-northeast1"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account_runner # "<SERVICE_ACCOUNT_ID>@<PROJECT_ID>.iam.gserviceaccount.com"

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    volumes {
      name = "data"
      empty_dir {
        medium     = "MEMORY"
        size_limit = "8Mi"
      }
    }

    containers {
      name       = "croaker"
      image      = "${var.registry_location}-docker.pkg.dev/${var.project_id}/${var.repositry_name}/${var.image_name}:${var.image_tag}" # "<LOCATION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/<IMAGE>:latest"
      depends_on = ["restore"]

      ports {
        container_port = 3000
      }
      env {
        name  = ""
        value = ""
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret.secret_id
            version = "1"
          }
        }
      }
      # TODO secretから取る方法がいいよね
      # STORAGE_BUCKET
      # STORAGE_DIRECTORY
      # NEXT_ORIGIN
      # NEXTAUTH_SECRET
      # NEXTAUTH_URL
      # GOOGLE_CLIENT_ID
      # GOOGLE_CLIENT_SECRET
      # GITHUB_ID
      # GITHUB_SECRET
      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }
    }
    containers {
      name       = "replicate"
      image      = "litestream/litestream:0.3.13"
      depends_on = ["restore"]

      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }

      command = "restore -if-db-not-exists -if-replica-exists -v -o ${var.database_path} gcs://${var.db_backet_name}/${var.db_backet_path} && nc -lkp 8081 -e echo restored"
      # command =  ['/bin/sh', '-c', '/usr/local/bin/litestream restore -if-db-not-exists -if-replica-exists -v -o /var/lib/myapp/db gcs://litestream-example/db && nc -lkp 8081 -e echo "restore completed!"']
    }
    containers {
      name  = "restore"
      image = "litestream/litestream:0.3.13"

      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }

      startupProbe {
        initial_delay_seconds = 0
        failure_threshold     = 1
        timeout_seconds       = 1
        period_seconds        = 3
        tcp_socket {
          port = 8081
        }
        http_get {
          port = 8080
        }
      }
      args = ["replicate", var.database_path, "gcs://${var.db_backet_name}/${var.db_backet_path}"]
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# TODO 公開のために必要？
# resource "google_cloud_run_service_iam_policy" "cloud_run_noauth" {
#   location    = google_cloud_run_v2_service.croaker_service.location
#   project     = google_cloud_run_v2_service.croaker_service.project
#   service     = google_cloud_run_v2_service.croaker_service.name
#   policy_data = data.google_iam_policy.cloud_run_noauth.policy_data
# }
# 
# data "google_iam_role" "run_invoker" {
#   name = "roles/run.invoker"
# }
# 
# data "google_iam_policy" "cloud_run_noauth" {
#   binding {
#     role    = data.google_iam_role.run_invoker.name
#     members = ["allUsers"]
#   }
# }
# 
# output "url" {
#   value = google_cloud_run_v2_service.main.uri
# }