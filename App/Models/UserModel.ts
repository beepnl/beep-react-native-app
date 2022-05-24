/*
{
    "id": 1317,
    "name": "test@test.com",
    "email": "test@test.com",
    "avatar": "default.jpg",
    "api_token": "1snu2aRRiwQNl2Tul567hLF0XpKuZO8hqkgXU4GvjzZ3f3pOCiDPFbBDea7W",
    "created_at": "2018-12-30 23:57:35",
    "updated_at": "2020-01-09 16:31:32",
    "last_login": "2020-01-09 16:31:32",
    "policy_accepted": "beep_terms_2018_05_25_avg_v1",
    "email_verified_at": "2018-05-25 00:00:00"
}
*/
export class UserModel {
  id: string
  name: string
  email: string

  constructor(props: any) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
  }

}
