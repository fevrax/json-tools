export const JsonSample = `
{
    "user": {
        "id": 1234567890,
        "name": "张三",
        "nameBase64": "5byg5LiJMTI=",
        "isActive": true,
        "profile": {
            "age": 29,
            "gender": "male",
            "address": {
                "country": "中国",
                "province": "北京",
                "city": "朝阳区",
                "details": null,
                "createTime": 1750563586000,
                "addr": "6LCD5bqm5Lit5b+D"
            }
        },
        "roles": [
            "admin",
            "editor",
            {
                "name": "custom",
                "permissions": [
                    "read",
                    "write",
                    {
                        "module": "finance",
                        "access": [
                            "view",
                            "export"
                        ]
                    }
                ]
            }
        ]
    },
    "posts": [
        {
            "id": 101,
            "title": "第一篇文章",
            "content": "这是内容。",

            "comments": [
                {
                    "user": "55So5oi3QQ==",
                    "text": "写得不错！",
                    "addr": "6LCD5bqm5Lit5b+D",
                    "replies": []
                },
            ],
            "metadata": {
                "createdAt": "2024-06-01T08:00:00Z",
                "updatedAt": null,
                "views": 1234,
                "isPinned": false,
                "extra": {
                    "shares": 10
                }
            }
        },
        {
            "id": 102,
            "title": "第二篇文章",
            "content": "内容二。",
            "tags": [],
            "comments": [],
            "metadata": {
                "createdAt": "2024-06-02T09:00:00Z",
                "updatedAt": "2024-06-02T10:00:00Z",
                "views": 56,
                "isPinned": true,
                "extra": {
                    "shares": 0,
                    "devices": []
                }
            }
        }
    ],
    "logs": [
        {
            "timestamp": "1750563661",
            "level": "info",
            "message": "55So5oi355m75b2V5oiQ5Yqf",
            "context": {
                "userId": 1234567890,
                "ip": "192.168.1.1",
                "device": {
                    "type": "mobile",
                    "os": "iOS",
                    "version": "14.7"
                }
            }
        },
        {
            "timestamp": "2024-06-01T13:00:00Z",
            "level": "error",
            "message": "数据库连接失败",
            "context": null
        }
    ],
    "analytics": {
        "traffic": {
            "daily": [
                {
                    "date": "2024-06-01",
                    "visits": 100
                },
                {
                    "date": "2024-06-02",
                    "visits": 120
                }
            ],
            "sources": {
                "direct": 50,
                "referral": 30,
                "social": {
                    "wechat": 10,
                    "weibo": 15,
                    "twitter": 5,
                    "others": []
                }
            }
        },
        "userStats": {
            "newUsers": 12,
            "activeUsers": [
                1,
                2,
                3,
                4,
                5
            ],
            "churnedUsers": null
        }
    },
    "nullField": null
}`;
