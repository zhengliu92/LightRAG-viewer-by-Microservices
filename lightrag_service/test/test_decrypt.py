from utils.decrypt import decrypt_api_key


def test_decrypt():
    api_key = "S/8uvddHOR6Eb3MWhYC4DbI6OgXP8K0/J3JKzZ74FZHBbDabSJd9i4rbBQPJjDefkGd0ujU2QWz2BEI1t1CxkhazVoVz7nSMXA9yq3W4PZIS7n6iTt/eTsAu/pFlmCr5AZu2KIsF27ZXjGbx/fglrfihMlw5nqFfviqBmCcSFC1hIdsX+glJEv0AXPmffIs86axTLjiPu+s7r0fmZkstKGVDctnlFpQbl5FvJVcsr0Kw/Xe+5lkdE8eVt771o+2E97eslaEGso0SyZTBQ0PZaDW0XrNI23uEL836aoWsMplM9NPH0MK1ArFIBRYr7oykltJGsvhveRxShE+fbVjBYg=="
    print(decrypt_api_key(api_key))


if __name__ == "__main__":
    test_decrypt()
