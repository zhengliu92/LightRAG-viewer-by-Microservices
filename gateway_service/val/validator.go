package val

import (
	"fmt"
	"net/mail"
	"regexp"
	"slices"
	"strings"
)

var (
	isValidUsername = regexp.MustCompile(`^[a-z0-9_]+$`).MatchString
	isValidFullName = regexp.MustCompile(`^[a-zA-Z\s]+$`).MatchString
)

func ValidateString(value string, minLength int, maxLength int) error {
	n := len(value)
	if n < minLength || n > maxLength {
		return fmt.Errorf("must contain from %d-%d characters", minLength, maxLength)
	}
	return nil
}

func ValidateUsername(value string) error {
	if err := ValidateString(value, 3, 100); err != nil {
		return err
	}
	if !isValidUsername(value) {
		return fmt.Errorf("must contain only lowercase letters, digits, or underscore")
	}
	return nil
}

func ValidateFullName(value string) error {
	if err := ValidateString(value, 3, 100); err != nil {
		return err
	}
	if !isValidFullName(value) {
		return fmt.Errorf("must contain only letters or spaces")
	}
	return nil
}

func ValidatePassword(value string) error {
	return ValidateString(value, 6, 100)
}

func ValidateEmail(value string) error {
	if err := ValidateString(value, 3, 200); err != nil {
		return err
	}
	// must contains @ and .
	if !strings.Contains(value, "@") || !strings.Contains(value, ".") {
		return fmt.Errorf("is not a valid email address")
	}
	if _, err := mail.ParseAddress(value); err != nil {
		return fmt.Errorf("is not a valid email address")
	}
	return nil
}

func ValidateEmailId(value int64) error {
	if value <= 0 {
		return fmt.Errorf("must be a positive integer")
	}
	return nil
}

func ValidateSecretCode(value string) error {
	return ValidateString(value, 32, 128)
}

func ValidateRoleName(value string) error {
	if err := ValidateString(value, 3, 100); err != nil {
		return err
	}
	// check if value is in []string{"admin", "user"}
	if !slices.Contains([]string{"admin", "user"}, value) {
		return fmt.Errorf("must be admin or user")
	}
	return nil
}

func ValidatePhone(value string) error {
	if err := ValidateString(value, 8, 12); err != nil {
		return err
	}
	// should be all digits
	if !regexp.MustCompile(`^[0-9]+$`).MatchString(value) {
		return fmt.Errorf("must be all digits")
	}
	return nil
}
