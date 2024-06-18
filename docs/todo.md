
## API
### croaks
- get /croak/top?offset_cursor=<number>&reverse=<boolean>
- get /croak/search?text=<text>&offset_cursor=<number>&reverse=<boolean>
- get /croak/<croak_id>?offset_cursor=<number>&reverse=<boolean>
- post /croak/top/text
  - text
- post /croak/<croak_id>/text
  - text
  - croak_id -> thread
- post /croak/top/file
  - file
- post /croak/<croak_id>/file
  - file
  - croak_id -> thread
- post /croak/<croak_id>/delete

### croakers
- post /crocker/self
  - name
  - description
  - form_agreement
- post /crocker/<identifier>/ban
- get /croaker/self/recent_activities
