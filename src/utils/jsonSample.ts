export const JsonSample = `
{
    "user": {
        "id": 1234567890,
        "name": "张三",
        "isActive": true,
        "profile": {
            "age": 29,
            "gender": "male",
            "address": {
                "country": "中国",
                "province": "北京",
                "city": "朝阳区",
                "details": null,
                "createTime": 1750563586000
            },
            "contacts": [
                {
                    "type": "email",
                    "value": "zhangsan@example.com",
                    "isPrimary": true
                },
                {
                    "type": "social",
                    "value": {
                        "wechat": "zhangsan_wechat",
                        "qq": "12345678"
                    },
                    "isPrimary": false
                }
            ]
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
            "tags": [
                "生活",
                "技术",
                null
            ],
            "comments": [
                {
                    "user": "用户A",
                    "text": "写得不错！",
                    "replies": []
                },
                {
                    "user": "用户B",
                    "text": "有点问题",
                    "replies": [
                        {
                            "user": "作者",
                            "text": "请指出具体问题，谢谢！",
                            "metadata": {
                                "timestamp": "2024-06-01T10:20:30Z",
                                "likes": 2,
                                "attachments": [
                                    null,
                                    {
                                        "type": "image",
                                        "url": "https://example.com/image.png"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ],
            "metadata": {
                "createdAt": "2024-06-01T08:00:00Z",
                "updatedAt": null,
                "views": 1234,
                "isPinned": false,
                "extra": {
                    "shares": 10,
                    "devices": [
                        {
                            "type": "mobile",
                            "os": "Android",
                            "versions": [
                                10,
                                11,
                                12
                            ]
                        },
                        {
                            "type": "desktop",
                            "os": "Windows",
                            "versions": [
                                7,
                                8.1,
                                10,
                                11
                            ]
                        }
                    ]
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
            "message": "用户登录成功",
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
}`
