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

    containers {
      name  = "croaker"
      image = "${var.registry_location}-docker.pkg.dev/${var.project_id}/${var.repositry_name}/${var.image_name}:${var.image_tag}" # "<LOCATION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/<IMAGE>:latest"
      depends_on = ["litestream"]
      ports {
        container_port = 3000
      }
      env {
      }
      volume {
        name  = "data"
        mount = "/var/lib/myapp"
      }
    }
    containers {
      name       = "litestream"
      image      = "litestream/litestream:0.3.9" # "<LOCATION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/<IMAGE>:latest"
      volume {
        name  = "data"
        mount = "/var/lib/myapp"
      }
      startupProbe {
        tcpSocket {
          port = 8081
        }
        initialDelaySeconds = 0
        failureThreshold = 30
        periodSeconds = 2
      }
      command =  ""
      # command: ['/bin/sh', '-c', '/usr/local/bin/litestream restore -if-db-not-exists -if-replica-exists -v -o /var/lib/myapp/db gcs://litestream-example/db && nc -lkp 8081 -e echo "restore completed!"']
      # args: ['replicate', '/var/lib/myapp/db', 'gcs://litestream-example/db']
    }

    volumes {
      name = "data"
      medium = Memory
      sizeLimit = 8Mi
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
